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
    showButtons?: boolean
    keyboardControl?: boolean
    scrollIntoViewOptions?: ScrollIntoOptions
    onHighlightStarted?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onHighlighted?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onDeselected?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onReset?: (element: Element, options: DriverOptions) => void
    onNext?: (element: Element, step: DriveStep, options: DriverOptions) => void
    onPrevious?: (element: Element, step: DriveStep, options: DriverOptions) => void
  }

  export interface DriveStep {
    element: string | Element
    popover?: {
      title?: string
      description?: string
      position?: 'top' | 'right' | 'bottom' | 'left' | 'auto'
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

  export default class Driver {
    constructor(options?: DriverOptions)
    highlight(step: DriveStep): Driver
    defineSteps(steps: DriveStep[]): Driver
    start(stepIndex?: number): Driver
    moveNext(): Driver
    movePrevious(): Driver
    hasNextStep(): boolean
    hasPreviousStep(): boolean
    preventMove(): Driver
    reset(): Driver
  }
}
