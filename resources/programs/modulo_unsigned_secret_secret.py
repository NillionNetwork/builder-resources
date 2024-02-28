from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    public_my_int1 = SecretUnsignedInteger(Input(name="my_uint1", party=party1))
    my_int2 = SecretUnsignedInteger(Input(name="my_uint2", party=party1))

    new_int = public_my_int1 % my_int2

    return [Output(new_int, "my_output", party1)]
