from nada_dsl import *

def nada_main():
    party1 = Party(name="party1")
    party2 = Party(name="party2")

    my_uint1 = SecretUnsignedInteger(Input(name="my_uint1", party=party1))
    my_uint2 = SecretUnsignedInteger(Input(name="my_uint2", party=party2))

    comp = my_uint1 <= my_uint2
    output = comp.if_else(UnsignedInteger(1), UnsignedInteger(2))

    return [Output(output, "my_output", party1)]
