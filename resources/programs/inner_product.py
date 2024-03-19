from nada_dsl import *

def nada_main():
    party1 = Party(name="Party1")
    my_array_1 = Array(SecretInteger(Input(name="my_array_1", party=party1)), size=3)
    my_array_2 = Array(SecretInteger(Input(name="my_array_2", party=party1)), size=3)

    @nada_fn
    def array_product(a: SecretInteger, b: SecretInteger) -> SecretInteger:
        return a * b 
    
    @nada_fn
    def add(a: SecretInteger, b: SecretInteger) -> SecretInteger:
        return a + b
    
    new_array = my_array_1.zip(my_array_2).map(array_product)

    inner_product = new_array.reduce(add, Integer(0))

    out = Output(inner_product, "out", party1)

    return [out]
