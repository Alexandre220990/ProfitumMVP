/// <reference types="react" />

// Étendre les types React pour corriger les problèmes avec React.lazy
declare module 'react' {
  // Redéfinir ReactNode pour être plus permissif
  type ReactNode = 
    | ReactElement
    | string
    | number
    | boolean
    | null
    | ReactFragment
    | ReactPortal;

  // Redéfinir FunctionComponent pour accepter ReactNode
  interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactNode;
    displayName?: string;
  }

  // Redéfinir ComponentClass pour accepter ReactNode
  interface ComponentClass<P = {}, S = ComponentState> {
    new(props: P, context?: any): Component<P, S>;
    defaultProps?: Partial<P>;
    displayName?: string;
  }

  // Redéfinir Component pour accepter ReactNode
  abstract class Component<P = {}, S = {}, SS = any> {
    constructor(props: P, context?: any);
    render(): ReactNode;
  }
}

export {}; 