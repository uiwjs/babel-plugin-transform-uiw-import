export default function _default(): any;


export interface Options {
  [key: string]: {
    transform: (importName: string) => void | string;
    preventFullImport?: boolean;
    skipDefaultConversion?: boolean;
  }
}