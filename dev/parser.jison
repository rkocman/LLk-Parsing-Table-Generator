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
    : head body EOF
    ;

token
    : ATOKEN
    | VTOKEN
    ;
    
head
    : /* eps */
    | TOKENDEF token head2
    ;

head2
    : token head2
    | head
    ;

body
    : BEGIN rule body2
    ;

body2
    : /* eps */
    | rule body2
    ;

rule
    : token ':' ruleb ';'
    ;

ruleb
    : /* eps */
    | token ruleb2
    | '|' ruleb
    ;

ruleb2
    : /* eps */
    | token ruleb2
    | '|' ruleb
    ;