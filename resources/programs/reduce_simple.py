from nada_dsl import Array, Party, SecretInteger, Output, Input, Integer, nada_fn


def nada_main():
    party1 = Party(name="Party1")
    my_array_1 = Array(SecretInteger(Input(name="my_array_1", party=party1)), size=3)

    @nada_fn
    def add(a: SecretInteger, b: SecretInteger) -> SecretInteger:
        return a + b

    addition = my_array_1.reduce(add, Integer(0))

    out = Output(addition, "out", party1)

    return [out]
