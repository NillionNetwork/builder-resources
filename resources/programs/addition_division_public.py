from nada_dsl import *

def nada_main():
    party1 = Party(name="Dealer")
    a = Integer(-42)
    b = Integer(-2)
    c = PublicInteger(Input(name="c", party=party1) )

    result = a + (b / c)
    return [Output(result, "result", party1)]