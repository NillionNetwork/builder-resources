from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    my_int1 = SecretInteger(Input(name="my_int1", party=party1))
    my_int2 = SecretInteger(Input(name="my_int2", party=party1))

    @nada_fn
    def max(a: SecretInteger, b: SecretInteger) -> SecretInteger:
        return (a < b).if_else(b, a)

    new_int = max(my_int1, my_int2)
    return [Output(new_int, "my_output", party1)]
