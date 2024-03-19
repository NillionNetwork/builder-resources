from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    a = SecretInteger(Input(name="a", party=party1))

    @nada_fn
    def add_secret_public(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left + right


    @nada_fn
    def add_secret(left: SecretInteger, right: SecretInteger) -> SecretInteger:
        return left + right

    left = Array.new(a, a, a)
    right = Array.new(Integer(1), Integer(2), Integer(3))

    additions = left.zip(right).map(add_secret_public)
    additions = additions.zip(additions).map(add_secret)

    return [Output(additions, "my_output", party1)]
