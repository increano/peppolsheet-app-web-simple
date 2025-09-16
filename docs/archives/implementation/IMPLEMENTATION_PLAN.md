# Web Client Implementation Plan

**Status:** 🚧 **ACTIVE DEVELOPMENT PLAN**  
**Timeline:** 8-10 weeks total  
**Current Progress:** Authentication system with email confirmation completed, form-based interface in progress

## 🎯 Implementation Priorities

### Priority 1: Complete Authentication System (Weeks 1-3) ✅ **COMPLETED**
### Priority 2: Build Clean Form-Based Interface (Weeks 4-6) 🚧 **IN PROGRESS**
### Priority 3: Implement Bulk Import/Export (Weeks 7-8) 📋 **PLANNED**
### Priority 4: Create Analytics Dashboard (Weeks 9-10) 📋 **PLANNED**

---

## 🔐 Priority 1: Complete Authentication System

**Timeline:** 3 weeks  
**Status:** ✅ **COMPLETED** - Production-ready authentication system with multi-tenant support

### Week 1: Session Management

#### 1.1 Complete Auth Context Implementation
**File:** `lib/auth-context.tsx`

```typescript
// Enhanced auth context with session management
interface AuthContext {
  user: User | null;
  tenant: Tenant | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, tenantName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Implementation steps:
1. Add session state management
2. Implement automatic token refresh
3. Add tenant context handling
4. Create session persistence
5. Add error handling for auth failures
```

#### 1.2 Session Storage Implementation
**File:** `lib/session-storage.ts`

```typescript
// Secure session storage utilities
class SessionStorage {
  static async storeSession(session: Session): Promise<void>
  static async getSession(): Promise<Session | null>
  static async clearSession(): Promise<void>
  static async refreshSession(): Promise<Session | null>
}

// Implementation tasks:
1. Create secure session storage utilities
2. Add session validation
3. Implement automatic cleanup
4. Add session expiry handling
```

#### 1.3 Token Refresh Mechanism
**File:** `hooks/use-session-refresh.ts`

```typescript
// Automatic token refresh
export const useSessionRefresh = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          await SessionStorage.storeSession(session);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);
};
```

### Week 2: Route Protection

#### 2.1 Authentication Middleware
**File:** `middleware.ts`

```typescript
// Complete middleware with auth protection
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Handle internationalization
  const locale = req.nextUrl.pathname.split('/')[1];
  if (!locales.includes(locale)) {
    return NextResponse.redirect(new URL('/en', req.url));
  }

  // Handle authentication
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/dashboard', '/invoices', '/customers', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.includes(path)
  );

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  // Tenant validation for protected routes
  if (session && isProtectedPath) {
    const tenantId = session.user.user_metadata?.tenant_id;
    if (!tenantId) {
      return NextResponse.redirect(new URL(`/${locale}/onboarding`, req.url));
    }
  }

  return res;
}

// Implementation tasks:
1. Combine i18n and auth middleware
2. Add protected route definitions
3. Implement tenant validation
4. Add redirect logic
5. Test all route scenarios
```

#### 2.2 Protected Route Components
**File:** `components/auth/protected-route.tsx`

```typescript
// Protected route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback = <LoginRedirect />
}) => {
  const { user, tenant, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return fallback;
  if (!tenant) return <TenantSelector />;
  
  if (requiredRole && !hasRole(user, tenant, requiredRole)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

### Week 3: Tenant Management

#### 3.1 Tenant Switching Implementation
**File:** `components/auth/tenant-switcher.tsx`

```typescript
// Tenant switcher component
export const TenantSwitcher = () => {
  const { user, tenant, switchTenant } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const handleTenantSwitch = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      // Invalidate and refetch all tenant-specific data
      queryClient.invalidateQueries({ queryKey: ['tenant-data'] });
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to switch tenant');
    }
  };

  return (
    <Select value={tenant?.id} onValueChange={handleTenantSwitch}>
      <SelectTrigger>
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

#### 3.2 Onboarding Flow
**File:** `app/[locale]/onboarding/page.tsx`

```typescript
// Multi-tenant onboarding page
export default function OnboardingPage() {
  const [step, setStep] = useState<'create' | 'join'>('create');
  
  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to PeppolSheet</CardTitle>
          <CardDescription>
            Set up your organization to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'create' ? (
            <CreateTenantForm onSuccess={() => router.push('/dashboard')} />
          ) : (
            <JoinTenantForm onSuccess={() => router.push('/dashboard')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Authentication Implementation Checklist

- [x] **Session Management**
  - [x] Enhanced auth context with session handling
  - [x] Secure session storage utilities
  - [x] Automatic token refresh mechanism
  - [x] Session expiry handling

- [x] **Route Protection**
  - [x] Combined i18n and auth middleware
  - [x] Protected route component wrapper
  - [x] Tenant validation for protected routes
  - [x] Redirect logic for unauthenticated users

- [x] **Tenant Management**
  - [x] Tenant switching functionality
  - [x] Onboarding flow for new users
  - [x] Tenant creation and joining
  - [x] Multi-tenant data isolation

### ✅ **Implementation Complete**

**Files Created/Modified:**
- `lib/auth-context.tsx` - Enhanced with full multi-tenant support + email confirmation
- `lib/session-storage.ts` - Secure session management utilities
- `hooks/use-session-refresh.ts` - Automatic token refresh
- `middleware.ts` - Complete route protection with tenant validation + auth callback
- `components/auth/protected-route.tsx` - Enhanced with role-based access
- `components/auth/tenant-switcher.tsx` - Real-time tenant switching
- `components/onboarding/create-tenant-form.tsx` - Tenant creation flow
- `components/onboarding/join-tenant-form.tsx` - Tenant joining flow
- `hooks/use-toast.ts` - Toast notification system
- **`app/auth/callback/route.ts`** - Email confirmation callback handler ✅ **NEW**
- **`app/[locale]/login/page.tsx`** - Enhanced with confirmation status handling ✅ **NEW**
- **`app/[locale]/signup/validate/page.tsx`** - Enhanced with resend email functionality ✅ **NEW**
- **`.env.example`** - Environment variables template ✅ **NEW**
- **`EMAIL_CONFIRMATION_SETUP.md`** - Complete email confirmation documentation ✅ **NEW**

**Key Features:**
- Production-ready authentication with enterprise-grade security
- Multi-tenant isolation with automatic RLS filtering
- Secure session storage with automatic refresh
- Comprehensive route protection middleware
- Real-time tenant switching with validation
- Complete onboarding flow for new users
- Role-based access control
- Error handling and user feedback
- **Complete email confirmation system** ✅ **NEW**
- **Resend email functionality** ✅ **NEW**
- **Auth callback handling** ✅ **NEW**
- **Error handling for email confirmation** ✅ **NEW**

---

## 📝 Priority 2: Build Clean Form-Based Interface

**Timeline:** 3 weeks  
**Status:** 🚧 **IN PROGRESS** - Authentication integration complete, forms ready for implementation

### Week 4: Form Foundation

#### 4.1 Form Component Architecture
**File:** `components/forms/form-wrapper.tsx`

```typescript
// Base form wrapper with authentication
interface FormWrapperProps<T> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (data: T) => Promise<void>;
  children: React.ReactNode;
  autoSave?: boolean;
  className?: string;
}

export function FormWrapper<T>({
  schema,
  initialValues,
  onSubmit,
  children,
  autoSave = true,
  className
}: FormWrapperProps<T>) {
  const { user } = useAuth();
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    mode: 'onChange'
  });

  // Auto-save implementation
  const debouncedSave = useMemo(
    () => debounce(async (data: T) => {
      if (autoSave && user) {
        await onSubmit(data);
      }
    }, 1000),
    [onSubmit, autoSave, user]
  );

  // Watch for changes and auto-save
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (autoSave && form.formState.isValid) {
        debouncedSave(value as T);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave, autoSave]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        {children}
      </form>
    </Form>
  );
}
```

#### 4.2 Validation Schemas
**File:** `lib/validations/invoice-schema.ts`

```typescript
// Comprehensive invoice validation schema
export const invoiceSchema = z.object({
  // Customer information
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email address"),
    vat_number: z.string().optional(),
    address: z.object({
      street: z.string().min(1, "Street address is required"),
      city: z.string().min(1, "City is required"),
      postal_code: z.string().min(1, "Postal code is required"),
      country: z.string().min(2, "Country is required")
    })
  }),
  
  // Invoice details
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Invalid date format"
  ),
  due_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Invalid date format"
  ),
  
  // Items
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    price: z.number().min(0, "Price must be positive"),
    tax_rate: z.number().min(0).max(100, "Tax rate must be between 0-100")
  })).min(1, "At least one item is required"),
  
  // Totals (calculated)
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  total: z.number().min(0),
  
  // Optional fields
  notes: z.string().optional(),
  terms: z.string().optional()
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
```

#### 4.3 Real-time Validation Hook
**File:** `hooks/use-realtime-validation.ts`

```typescript
// Real-time validation with debouncing
export const useRealtimeValidation = <T>(
  schema: ZodSchema<T>,
  debounceMs: number = 300
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(
    debounce(async (field: string, value: any) => {
      setIsValidating(true);
      
      try {
        await schema.parseAsync({ [field]: value });
        setErrors(prev => ({ ...prev, [field]: undefined }));
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldError = error.errors.find(e => e.path[0] === field);
          if (fieldError) {
            setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          }
        }
      } finally {
        setIsValidating(false);
      }
    }, debounceMs),
    [schema, debounceMs]
  );

  const validateField = useCallback((field: string, value: any) => {
    validate(field, value);
  }, [validate]);

  return { errors, isValidating, validateField };
};
```

### Week 5: Core Form Components

#### 5.1 Invoice Form Implementation
**File:** `components/forms/invoice-form.tsx`

```typescript
// Complete invoice form with real-time validation
export const InvoiceForm = () => {
  const { user } = useAuth();
  const { errors, validateField } = useRealtimeValidation(invoiceSchema);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .insert({
          ...data,
          tenant_id: user?.user_metadata?.tenant_id,
          created_by: user?.id
        });

      if (error) throw error;
      toast.success('Invoice created successfully');
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormWrapper
      schema={invoiceSchema}
      initialValues={{
        customer: {
          name: '',
          email: '',
          vat_number: '',
          address: {
            street: '',
            city: '',
            postal_code: '',
            country: ''
          }
        },
        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        items: [{ description: '', quantity: 1, price: 0, tax_rate: 21 }],
        subtotal: 0,
        tax_amount: 0,
        total: 0,
        notes: '',
        terms: ''
      }}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <CustomerSection />
      <InvoiceDetailsSection />
      <ItemsSection />
      <TotalsSection />
      <NotesSection />
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline">
          Save Draft
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </FormWrapper>
  );
};
```

#### 5.2 Multi-Step Form Implementation
**File:** `components/forms/multi-step-form.tsx`

```typescript
// Multi-step form with progress tracking
interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation?: ZodSchema<any>;
}

export const MultiStepForm = ({ steps }: { steps: Step[] }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    if (currentStepData.validation) {
      try {
        await currentStepData.validation.parseAsync(formData);
      } catch (error) {
        toast.error('Please fix validation errors');
        return;
      }
    }

    setCompletedSteps(prev => [...prev, currentStep]);
    
    if (isLastStep) {
      await handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    completedSteps.includes(index)
                      ? 'bg-green-500 border-green-500 text-white'
                      : index === currentStep
                      ? 'border-blue-500 text-blue-500'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {completedSteps.includes(index) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm font-medium mt-2">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    completedSteps.includes(index)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {React.createElement(currentStepData.component, {
            data: formData,
            onChange: setFormData,
            errors: {},
            onNext: handleNext,
            onPrev: handlePrev,
            isFirstStep,
            isLastStep
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep}
        >
          Previous
        </Button>
        <Button type="button" onClick={handleNext}>
          {isLastStep ? 'Submit' : 'Next'}
        </Button>
      </div>
    </div>
  );
};
```

### Week 6: Advanced Form Features

#### 6.1 Auto-Save Implementation
**File:** `hooks/use-auto-save.ts`

```typescript
// Debounced auto-save with conflict resolution
export const useAutoSave = <T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: {
    debounceMs?: number;
    enabled?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  const {
    debounceMs = 1000,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debouncedSave = useMemo(
    () => debounce(async (dataToSave: T) => {
      if (!enabled) return;

      setIsSaving(true);
      setHasUnsavedChanges(false);

      try {
        await saveFunction(dataToSave);
        setLastSaved(new Date());
        onSuccess?.();
      } catch (error) {
        setHasUnsavedChanges(true);
        onError?.(error as Error);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs),
    [saveFunction, enabled, debounceMs, onSuccess, onError]
  );

  useEffect(() => {
    if (data && enabled) {
      setHasUnsavedChanges(true);
      debouncedSave(data);
    }
  }, [data, debouncedSave, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    forceSave: () => debouncedSave.flush()
  };
};
```

#### 6.2 Dynamic Form Fields
**File:** `components/forms/dynamic-form-fields.tsx`

```typescript
// Dynamic form fields for invoice items
export const DynamicInvoiceItems = () => {
  const { control, watch } = useFormContext<InvoiceFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  // Calculate totals automatically
  useEffect(() => {
    const subtotal = watchedItems.reduce(
      (sum, item) => sum + (item.quantity * item.price),
      0
    );
    const taxAmount = watchedItems.reduce(
      (sum, item) => sum + (item.quantity * item.price * item.tax_rate / 100),
      0
    );
    const total = subtotal + taxAmount;

    // Update form values
    setValue('subtotal', subtotal);
    setValue('tax_amount', taxAmount);
    setValue('total', total);
  }, [watchedItems]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoice Items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ description: '', quantity: 1, price: 0, tax_rate: 21 })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {fields.map((field, index) => (
        <Card key={field.id} className="p-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <FormField
                control={control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Item description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={control}
                name={`items.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={control}
                name={`items.${index}.tax_rate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax %</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1 flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
```

### Form Implementation Checklist

- [ ] **Form Foundation**
  - [ ] Base form wrapper with authentication
  - [ ] Comprehensive validation schemas
  - [ ] Real-time validation hook
  - [ ] Error handling and display

- [ ] **Core Form Components**
  - [ ] Invoice form implementation
  - [ ] Multi-step form with progress
  - [ ] Customer form components
  - [ ] Item management components

- [ ] **Advanced Features**
  - [ ] Auto-save with debouncing
  - [ ] Dynamic form fields
  - [ ] Real-time calculations
  - [ ] Conflict resolution

---

## 📥 Priority 3: Implement Bulk Import/Export

**Timeline:** 2 weeks  
**Status:** 📋 **PLANNED** - Ready for implementation with authentication support

### Week 7: Import System

#### 7.1 File Upload Component
**File:** `components/import/file-upload.tsx`

```typescript
// File upload with drag-and-drop
export const FileUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
    }
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/import/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const result = await response.json();
        setProgress(prev => prev + (100 / files.length));
      }

      toast.success('Files uploaded successfully');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Or click to select files (CSV, XLSX, PDF)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Selected Files:</h3>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className="w-full"
      >
        {uploading ? 'Uploading...' : 'Upload Files'}
      </Button>
    </div>
  );
};
```

#### 7.2 Data Processing Pipeline
**File:** `lib/import/data-processor.ts`

```typescript
// Data processing pipeline for different file types
export class DataProcessor {
  static async processCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  static async processXLSX(file: File): Promise<any[]> {
    const workbook = XLSX.read(await file.arrayBuffer());
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  static async processPDF(file: File): Promise<any[]> {
    // PDF processing would require OCR service
    // This is a placeholder for PDF data extraction
    const text = await extractTextFromPDF(file);
    return parseInvoiceData(text);
  }

  static validateData(data: any[], schema: ZodSchema): ValidationResult {
    const results = data.map((item, index) => {
      try {
        const validated = schema.parse(item);
        return { index, valid: true, data: validated, errors: [] };
      } catch (error) {
        const zodError = error as ZodError;
        return {
          index,
          valid: false,
          data: item,
          errors: zodError.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        };
      }
    });

    return {
      valid: results.filter(r => r.valid),
      invalid: results.filter(r => !r.valid),
      summary: {
        total: data.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length
      }
    };
  }
}
```

### Week 8: Export System

#### 8.1 Export Component
**File:** `components/export/export-data.tsx`

```typescript
// Data export component
export const ExportData = () => {
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          dateRange,
          type: 'invoices'
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>
          Export your invoices and financial data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
        >
          {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 📊 Priority 4: Create Analytics Dashboard

**Timeline:** 2 weeks  
**Status:** 📋 **PLANNED** - Ready for implementation with authentication and tenant support

### Week 9: Dashboard Foundation

#### 9.1 Analytics Layout
**File:** `components/analytics/analytics-dashboard.tsx`

```typescript
// Analytics dashboard layout
export const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const tenantId = user?.user_metadata?.tenant_id;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?tenant_id=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId
  });

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          format="currency"
          change={metrics?.revenueChange || 0}
        />
        <MetricCard
          title="Outstanding Invoices"
          value={metrics?.outstandingInvoices || 0}
          format="number"
          change={metrics?.outstandingChange || 0}
        />
        <MetricCard
          title="Paid This Month"
          value={metrics?.paidThisMonth || 0}
          format="currency"
          change={metrics?.paidChange || 0}
        />
        <MetricCard
          title="Overdue Amount"
          value={metrics?.overdueAmount || 0}
          format="currency"
          change={metrics?.overdueChange || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={metrics?.revenueChart || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={metrics?.statusChart || []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentInvoicesTable data={metrics?.recentInvoices || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersList data={metrics?.topCustomers || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### Week 10: Advanced Analytics

#### 10.1 Real-time Updates
**File:** `hooks/use-realtime-analytics.ts`

```typescript
// Real-time analytics updates
export const useRealtimeAnalytics = (tenantId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tenantId) return;

    const subscription = supabase
      .channel('analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // Invalidate analytics queries when invoice data changes
          queryClient.invalidateQueries(['analytics', tenantId]);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [tenantId, queryClient]);
};
```

## 🎯 Implementation Schedule

### Phase 1: Authentication (Weeks 1-3)
- **Week 1**: Session management and auth context
- **Week 2**: Route protection and middleware
- **Week 3**: Tenant management and onboarding

### Phase 2: Forms (Weeks 4-6)
- **Week 4**: Form foundation and validation
- **Week 5**: Core form components
- **Week 6**: Advanced form features

### Phase 3: Import/Export (Weeks 7-8)
- **Week 7**: Import system and file processing
- **Week 8**: Export system and data formatting

### Phase 4: Analytics (Weeks 9-10)
- **Week 9**: Dashboard foundation and metrics
- **Week 10**: Advanced analytics and real-time updates

## 📋 Success Criteria

### Authentication Complete
- [x] User can login/logout with session persistence
- [x] Protected routes redirect unauthenticated users
- [x] Tenant switching works seamlessly
- [x] Onboarding flow for new users

### Forms Complete
- [ ] Invoice form with real-time validation
- [ ] Auto-save functionality working
- [ ] Multi-step forms with progress tracking
- [ ] Dynamic form fields for invoice items

### Import/Export Complete
- [ ] CSV/XLSX file upload and processing
- [ ] Data validation and error handling
- [ ] Export in multiple formats
- [ ] Progress tracking for bulk operations

### Analytics Complete
- [ ] Real-time dashboard with key metrics
- [ ] Revenue trends and status charts
- [ ] Recent invoices and top customers
- [ ] Real-time updates when data changes

This implementation plan provides a clear roadmap for completing the web client development with specific timelines, code examples, and success criteria. Each priority builds upon the previous one, ensuring a logical development progression.

---

## 📊 Current Status Summary

### ✅ **Completed (Priority 1)**
- **Authentication System**: Production-ready with enterprise-grade security
- **Session Management**: Secure storage with automatic refresh
- **Route Protection**: Comprehensive middleware with tenant validation
- **Tenant Management**: Real-time switching and onboarding flows
- **Multi-tenant Security**: Complete isolation with RLS integration

### 🚧 **In Progress (Priority 2)**
- **Form Foundation**: Authentication integration complete
- **Validation System**: Zod schemas ready for implementation
- **UI Components**: Shadcn UI components available

### 📋 **Ready for Implementation**
- **Priority 2**: Form-based interface with authentication support
- **Priority 3**: Bulk import/export with tenant isolation
- **Priority 4**: Analytics dashboard with real-time updates

### 🎯 **Next Steps**
1. Implement clean form-based interface for invoice/bill management
2. Add bulk import/export functionality with progress tracking
3. Create analytics dashboard with charts and reporting
4. Begin mobile client development with shared authentication 