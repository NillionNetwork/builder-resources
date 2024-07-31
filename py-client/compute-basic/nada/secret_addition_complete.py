from nada_dsl import *
import pkg_resources

version = pkg_resources.get_distribution("nada_dsl").version
assert version == "0.5.0"

def nada_main():

    party1 = Party(name="Party1")

    my_int1 = SecretInteger(Input(name="my_int1", party=party1))

    my_int2 = SecretInteger(Input(name="my_int2", party=party1))

    new_int = my_int1 + my_int2

    return [Output(new_int, "my_output", party1)]
