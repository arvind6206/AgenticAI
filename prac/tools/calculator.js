export const calculator = ({a, b, operation}) => {
    switch(operation){
        case "add":
            return a + b;

        case "substract":
            return a - b;

        case "multiply":
            return a * b;
        
        case "divide":
            if(b === 0){
                throw new Error("Can not divide by zero")
            }

            return a / b;
        default:
            throw new Error("Invalid operation")
    }
}