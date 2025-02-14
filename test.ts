import { formula, init } from 'expressionparser';

const parser = init(formula, (term: string) => {
    if (term === "MY_VARIABLE") {
        return 42;
    } else {
        throw new Error(`Invalid term: ${term}`);
    }
});

console.log(parser.expressionToValue("(1 + 55) + 40"))