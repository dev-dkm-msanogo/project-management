/** Port SORTANT : identifiants techniques uniques, ex. « u-3f9c2a7e ». */
export interface IdGenerator {
  next(prefix: string): string;
}
