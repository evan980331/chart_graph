declare module 'driver.js' {
  export interface DriverOptions {
    animate?: boolean
    opacity?: number
    padding?: number
    allowClose?: boolean
    overlayClickNext?: boolean
    overlayClickStep?: boolean
    overlayClickBehavior?: 'close' | 'next' | 'wait'
    stageBackground?: string
    doneBtnText?: string
    closeBtnText?: string
    nextBtnText?: string
    prevBtnText?: string
    showButtons?: string[]
    keyboardControl?: boolean
    scrollIntoViewOptions?: ScrollIntoOptions
    onHighlightStarted?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onHighlighted?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onDeselected?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onDestroy?: (element?: Element, step?: DriveStep, options?: DriverOptions) => void
    onNext?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onPrevious?: (element: Element, step: DriveStep, options: DriverOptions) => void
  }

  export interface DriveStep {
    element: string | Element
    popover?: {
      title?: string
      description?: string
      position?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
      side?: string
      align?: string
      className?: string
      doneBtnText?: string
      closeBtnText?: string
      nextBtnText?: string
      prevBtnText?: string
    }
    stage?: {
      padding?: number
      borderRadius?: number
    }
  }

  export interface DriverInstance {
    highlight(step: DriveStep): DriverInstance
    setSteps(steps: DriveStep[]): DriverInstance
    drive(stepIndex?: number): void
    destroy(): void
    moveNext(): void
    movePrevious(): void
    hasNextStep(): boolean
    hasPreviousStep(): boolean
  }

  export function driver(options?: DriverOptions): DriverInstance
}
