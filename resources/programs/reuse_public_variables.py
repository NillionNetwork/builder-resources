from nada_dsl import *

def nada_main():
    party1 = Party(name="Dealer")
    a = Integer(0)
    b = PublicInteger(Input(name="b", party=party1) )

    result = a + (b + b)
    return [Output(result, "result", party1)]
