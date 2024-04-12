from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    a = Array(SecretInteger(Input(name="a", party=party1)), size=3)
    b = Array(SecretInteger(Input(name="b", party=party1)), size=3)

    @nada_fn
    def mul(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left * right

    @nada_fn
    def add(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left + right

    result = a.zip(b).map(add).zip(b).map(mul)

    return [Output(result, "my_output", party1)]
