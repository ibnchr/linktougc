import { Search, BrainCircuit, FileText, Video, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { useAppStore } from "@/store/use-store"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const STEPS = [
  { key: "scraping", label: "Scraping Produk", icon: Search },
  { key: "analyzing", label: "Analisis AI", icon: BrainCircuit },
  { key: "scripting", label: "Buat Script", icon: FileText },
  { key: "rendering", label: "Render Video", icon: Video },
  { key: "completed", label: "Selesai!", icon: CheckCircle2 },
] as const

type StepKey = (typeof STEPS)[number]["key"]
type StepStatus = "pending" | "active" | "completed" | "error"

const STEP_ORDER: StepKey[] = STEPS.map((s) => s.key)

function getStatus(currentStep: StepKey | null, stepKey: StepKey): StepStatus {
  const currentIdx = currentStep ? STEP_ORDER.indexOf(currentStep) : -1
  const stepIdx = STEP_ORDER.indexOf(stepKey)

  if (currentIdx < 0) return "pending"
  if (stepIdx < currentIdx) return "completed"
  if (stepIdx === currentIdx) return "active"
  return "pending"
}

export function ProgressSteps() {
  const { step, progress, message } = useAppStore()

  const currentStep = (step ?? null) as StepKey | null

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-1 md:gap-2">
        {STEPS.map((s, i) => {
          const status = getStatus(currentStep, s.key)
          const Icon = s.icon
          const isConnected = i < STEPS.length - 1

          return (
            <div key={s.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={cn(
                    "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0",
                    status === "completed" && "border-green-500 bg-green-500/10 text-green-500",
                    status === "active" && "border-primary bg-primary/10 text-primary animate-pulse",
                    status === "pending" && "border-muted-foreground/30 text-muted-foreground/40",
                    status === "error" && "border-destructive bg-destructive/10 text-destructive animate-pulse",
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                  ) : status === "active" ? (
                    <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] md:text-xs font-medium text-center leading-tight truncate max-w-full",
                    status === "completed" && "text-green-500",
                    status === "active" && "text-primary",
                    status === "pending" && "text-muted-foreground/50",
                    status === "error" && "text-destructive",
                  )}
                >
                  {s.label}
                </span>
              </div>

              {isConnected && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 md:mx-2 rounded transition-colors duration-500",
                    status === "completed" ? "bg-green-500" : "bg-muted-foreground/20",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {progress != null && (
        <Progress
          value={progress}
          className="h-1.5 md:h-2 transition-all duration-500"
        />
      )}

      {message && (
        <p className="text-xs md:text-sm text-muted-foreground text-center animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
