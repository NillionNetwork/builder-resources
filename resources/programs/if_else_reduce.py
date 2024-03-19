from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    party2 = Party(name="Party2")

    my_array = Array(SecretInteger(Input(name="my_array", party=party1)), size=3)

    @nada_fn
    def count_negative_numbers(a: PublicInteger, b: SecretInteger) -> PublicInteger:
        cond = b >= Integer(0)
        is_negative_number = (cond.reveal().if_else(Integer(0), Integer(1)))
        return a + is_negative_number

    output = my_array.reduce(count_negative_numbers, Integer(0))

    return [Output(output, "my_output", party1)]
