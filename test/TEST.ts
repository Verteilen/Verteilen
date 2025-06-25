import { init, formula } from 'expressionparser'

const parser = init(formula, (term: string) => {
  if (term === "a") {
    return true;
  } else if (term === "n"){
    return 5
  }
   else {
    throw new Error(`Invalid term: ${term}`);
  }
});

const r = parser.expressionToValue("IF(a, STRING([\"sss\", n]), \"\")"); // true
console.log(r)