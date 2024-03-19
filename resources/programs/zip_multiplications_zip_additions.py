from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    a = SecretInteger(Input(name="a", party=party1))
    b = SecretInteger(Input(name="b", party=party1))

    @nada_fn
    def mul(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left * right

    @nada_fn
    def add(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left + right

    left = Array.new(a, a, a)
    right = Array.new(b, b, b)

    multiplications = left.zip(right).map(mul)
    additions = multiplications.zip(multiplications).map(add)

    return [Output(additions, "my_output", party1)]
