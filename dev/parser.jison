/*!
 * Input Parser for LL(k) Parsing Table Generator
 * https://github.com/Gals42/LLk-Parsing-Table-Generator
 * Author: Radim Kocman
 */

/* Lexemes */
%lex
%%

\s+                         /* skip whitespace */
"//".*                      /* skip single-line comment */
"/*"(.|\n|\r)*?"*/"         /* skip multi-line comment */
"%token"                    return 'TOKENDEF'
"%%"                        return 'BEGIN'
":"                         return ':'
"|"                         return '|'
";"                         return ';'
[a-zA-Z][a-zA-Z0-9]*        return 'ATOKEN'
"'".+?"'"|"\"".+?"\""       return 'VTOKEN'
<<EOF>>                     return 'EOF'

/lex

%start start

%% /* Input Grammar */

start 
    : head body EOF { ParserHandler.finish(); }
    ;

token
    : ATOKEN { $$ = [new GElement(yytext, GType.A)]; }
    | VTOKEN { $$ = [new GElement(yytext, GType.V)]; }
    ;
    
head
    : headdef head { ParserHandler.setT($1.concat($2)); }
    | /* eps */ { $$ = []; }
    ;

headdef
    : TOKENDEF token headdef2 { $$ = $2.concat($3); }
    ;

headdef2
    : token headdef2 { $$ = $1.concat($2); }
    | /* eps */ { $$ = []; }
    ;

body
    : BEGIN rule body2
    ;

body2
    : rule body2
    | /* eps */
    ;

rule
    : token ':' rule2 ';' { ParserHandler.setR($1[0], $3); }
    ;

rule2
    : token rule2 { $$ = $1.concat($2); }
    | '|' rule2 { ParserHandler.setHalfR($2); $$ = []; }
    | /* eps */ { $$ = []; }
    ;