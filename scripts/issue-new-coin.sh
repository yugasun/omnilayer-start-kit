#!/usr/bin/env bash

# -e: when the return of command is unequal 0, shell will be exited.
set -e

# Why need generate 100 before our coin issue?
#   When a block becomes an orphan block, all of its valid transactions are re-added to the pool of queued transactions and will be included in another block.
#   The 50 BTC reward for the orphan block will be lost, which is why a network-enforced 100-block maturation time for generations exists.
# Refer to https://bitcoin.stackexchange.com/questions/1991/what-is-the-block-maturation-time
# btc mining
omnicore-cli generate 100

# generate owner address
address=`omnicore-cli getnewaddress`

# store owner address
echo $address > /root/owner-address

# and bitcoin to owner address
omnicore-cli sendtoaddress $address 1

# set owner address account name, this is for omnicore-cli getbalance command
omnicore-cli setaccount $address owner

# check owner bitcoin balance
omnicore-cli getbalance owner

# blockchain confirm
omnicore-cli generate 1

###
# Create new coin
#omni_sendissuancefixed "fromaddress" ecosystem type previousid "category" "subcategory" "name" "url" "data" "amount"
#Create new tokens with fixed supply.

#    Arguments:
#    1. fromaddress          (string, required) the address to send from
#    2. ecosystem            (string, required) the ecosystem to create the tokens in (1 for main ecosystem, 2 for test ecosystem)
#    3. type                 (number, required) the type of the tokens to create: (1 for indivisible tokens, 2 for divisible tokens)
#    4. previousid           (number, required) an identifier of a predecessor token (use 0 for new tokens)
#    5. category             (string, required) a category for the new tokens (can be "")
#    6. subcategory          (string, required) a subcategory for the new tokens  (can be "")
#    7. name                 (string, required) the name of the new tokens to create
#    8. url                  (string, required) an URL for further information about the new tokens (can be "")
#    9. data                 (string, required) a description for the new tokens (can be "")
#    10. amount              (string, required) the number of tokens to create
#
#    Result:
#    "hash"                  (string) the hex-encoded transaction hash
###
omnicore-cli omni_sendissuancefixed $address 1 2 0 "yugaCategory" "yugaSubcategory" "yuga" "yugasun.com" "yuga for test" "100000"

# blockchain confirm
omnicore-cli generate 1
