// 简化的UI组件集合，避免创建过多文件
import React from 'react';
import { clsx } from 'clsx';

// Badge组件
export const Badge = ({ className, variant = 'default', children, ...props }: any) => (
  <div
    className={clsx(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      {
        "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === 'default',
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === 'secondary',
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80": variant === 'outline',
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Select组件
export const Select = ({ className, children, ...props }: any) => (
  <select
    className={clsx(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </select>
);

// Checkbox组件
export const Checkbox = ({ className, ...props }: any) => (
  <input
    type="checkbox"
    className={clsx(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  />
);

// Label组件
export const Label = ({ className, ...props }: any) => (
  <label
    className={clsx("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
    {...props}
  />
);

// Slider组件
export const Slider = ({ className, ...props }: any) => (
  <input
    type="range"
    className={clsx(
      "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700",
      className
    )}
    {...props}
  />
);

// Switch组件
export const Switch = ({ className, ...props }: any) => (
  <button
    type="button"
    role="switch"
    className={clsx(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
  >
    <span
      data-state={props.checked ? 'checked' : 'unchecked'}
      className={clsx(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </button>
);

// Alert组件
export const Alert = ({ className, children, ...props }: any) => (
  <div
    role="alert"
    className={clsx(
      "relative w-full rounded-lg border p-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const AlertDescription = ({ className, ...props }: any) => (
  <div
    className={clsx("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
);

// Progress组件
export const Progress = ({ className, value = 0, ...props }: any) => (
  <div
    className={clsx(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - value}%)` }}
    />
  </div>
);

// Spinner组件
export const Spinner = ({ className, ...props }: any) => (
  <div
    className={clsx(
      "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
      className
    )}
    {...props}
  />
);

// Dialog组件
export const Dialog = ({ children, ...props }: any) => <>{children}</>;

export const DialogContent = ({ className, children, ...props }: any) => (
  <div
    className={clsx(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const DialogHeader = ({ className, children, ...props }: any) => (
  <div
    className={clsx("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  >
    {children}
  </div>
);

export const DialogTitle = ({ className, children, ...props }: any) => (
  <h2
    className={clsx("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h2>
);

export const DialogTrigger = ({ className, children, ...props }: any) => (
  <div className={className} {...props}>
    {children}
  </div>
);

// Textarea组件
export const Textarea = ({ className, ...props }: any) => (
  <textarea
    className={clsx(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
);

// DatePicker组件（简单包装原生日期选择）
export const DatePicker = ({ className, ...props }: any) => (
  <input
    type="date"
    className={clsx(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      className
    )}
    {...props}
  />
);

// DateRangePicker组件（简易实现）
export const DateRangePicker = ({ value, onChange, className }: any) => (
  <div className={clsx("flex items-center gap-2", className)}>
    <input
      type="date"
      value={value?.from || ''}
      onChange={(e) => onChange?.({ ...value, from: e.target.value })}
      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
    <span>至</span>
    <input
      type="date"
      value={value?.to || ''}
      onChange={(e) => onChange?.({ ...value, to: e.target.value })}
      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  </div>
);

// Avatar组件
export const Avatar = ({ className, children, ...props }: any) => (
  <div
    className={clsx(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const AvatarImage = ({ className, ...props }: any) => (
  <img
    className={clsx("aspect-square h-full w-full", className)}
    {...props}
  />
);

export const AvatarFallback = ({ className, children, ...props }: any) => (
  <div
    className={clsx(
      "flex h-full w-full items-center justify-center bg-muted text-sm font-medium",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Tabs组件
export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const TabsList = ({ className, children, ...props }: any) => (
  <div
    className={clsx(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const TabsTrigger = ({ className, children, ...props }: any) => (
  <button
    className={clsx(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const TabsContent = ({ className, children, ...props }: any) => (
  <div
    className={clsx(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// ScrollArea组件
export const ScrollArea = ({ className, children, ...props }: any) => (
  <div
    className={clsx("relative overflow-auto", className)}
    {...props}
  >
    {children}
  </div>
);

// Separator组件
export const Separator = ({ className, ...props }: any) => (
  <div
    className={clsx("shrink-0 bg-border", { "h-[1px] w-full": true }, className)}
    {...props}
  />
);

// Collapsible组件
export const Collapsible = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const CollapsibleContent = ({ children, ...props }: any) => (
  <div {...props}>
    {children}
  </div>
);

export const CollapsibleTrigger = ({ children, ...props }: any) => (
  <button {...props}>
    {children}
  </button>
);
