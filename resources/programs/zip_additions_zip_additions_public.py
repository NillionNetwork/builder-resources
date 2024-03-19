from nada_dsl import *


def nada_main():
    party1 = Party(name="Party1")
    a = PublicInteger(Input(name="a", party=party1))
    b = PublicInteger(Input(name="b", party=party1))

    @nada_fn
    def add(left: PublicInteger, right: PublicInteger) -> PublicInteger:
        return left + right

    left = Array.new(a, a, a)
    right = Array.new(b, b, b)

    additions = left.zip(right).map(add)
    additions = additions.zip(additions).map(add)

    return [Output(additions, "my_output", party1)]
