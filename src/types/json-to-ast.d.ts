declare module 'json-to-ast' {
  interface ASTNode {
    type: string
    children?: ASTNode[]
    loc?: {
      start: { line: number; column: number }
      end: { line: number; column: number }
    }
    key?: ASTNode
    value?: ASTNode
  }

  function parse(json: string, options?: { loc?: boolean }): ASTNode
  export default parse
}
