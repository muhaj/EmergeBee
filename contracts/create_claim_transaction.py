"""
Handle Algorand ASA opt-in and transfer for reward claiming
"""

import sys
import json
import base64
import os
from algosdk import mnemonic, account
from algosdk.v2client import algod
from algosdk.transaction import AssetTransferTxn, wait_for_confirmation
from algosdk import encoding

# Algorand TestNet configuration
TESTNET_ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
TESTNET_ALGOD_TOKEN = ""


def check_asset_opted_in(client, address, asa_id):
    """
    Check if an account has opted in to an ASA
    
    Returns:
        bool: True if opted in, False otherwise
    """
    try:
        account_info = client.account_info(address)
        assets = account_info.get('assets', [])
        
        for asset in assets:
            if asset['asset-id'] == int(asa_id):
                return True
        return False
    except Exception:
        return False


def create_opt_in_transaction(receiver_address, asa_id):
    """
    Create an unsigned opt-in transaction for the player to sign
    
    Returns:
        dict: {
            'success': bool,
            'needs_optin': bool,
            'unsigned_txn': str (base64 encoded msgpack),
            'error': str (if failed)
        }
    """
    try:
        client = algod.AlgodClient(
            algod_token=TESTNET_ALGOD_TOKEN,
            algod_address=TESTNET_ALGOD_ADDRESS
        )
        
        params = client.suggested_params()
        
        # Create opt-in transaction (amount=0, sender=receiver=same address)
        txn = AssetTransferTxn(
            sender=receiver_address,
            sp=params,
            receiver=receiver_address,
            amt=0,
            index=int(asa_id)
        )
        
        # encoding.msgpack_encode already returns base64 string
        unsigned_txn_b64 = encoding.msgpack_encode(txn)
        
        return {
            'success': True,
            'needs_optin': True,
            'unsigned_txn': unsigned_txn_b64
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to create opt-in transaction: {str(e)}'
        }


def transfer_asa(receiver_address, asa_id, amount):
    """
    Transfer ASA from deployer to receiver (backend signs and submits)
    
    Returns:
        dict: {
            'success': bool,
            'tx_id': str,
            'error': str (if failed)
        }
    """
    try:
        client = algod.AlgodClient(
            algod_token=TESTNET_ALGOD_TOKEN,
            algod_address=TESTNET_ALGOD_ADDRESS
        )
        
        # Get deployer mnemonic
        deployer_mnemonic = os.getenv('ALGORAND_DEPLOYER_MNEMONIC')
        if not deployer_mnemonic:
            return {
                'success': False,
                'error': 'ALGORAND_DEPLOYER_MNEMONIC not set'
            }
        
        deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
        deployer_address = account.address_from_private_key(deployer_private_key)
        
        params = client.suggested_params()
        
        # Create transfer transaction
        txn = AssetTransferTxn(
            sender=deployer_address,
            sp=params,
            receiver=receiver_address,
            amt=amount,
            index=int(asa_id)
        )
        
        # Sign transaction
        signed_txn = txn.sign(deployer_private_key)
        
        # Submit transaction
        tx_id = client.send_transaction(signed_txn)
        
        # Wait for confirmation
        wait_for_confirmation(client, tx_id, 4)
        
        return {
            'success': True,
            'tx_id': tx_id,
            'receiver': receiver_address,
            'asa_id': asa_id,
            'amount': amount
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Failed to transfer ASA: {str(e)}'
        }


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python create_claim_transaction.py <receiver_address> <asa_id> <amount>'
        }))
        sys.exit(1)
    
    receiver_address = sys.argv[1]
    asa_id = sys.argv[2]
    amount = int(sys.argv[3])
    
    # Initialize client
    client = algod.AlgodClient(
        algod_token=TESTNET_ALGOD_TOKEN,
        algod_address=TESTNET_ALGOD_ADDRESS
    )
    
    # Check if user has opted in to the ASA
    opted_in = check_asset_opted_in(client, receiver_address, asa_id)
    
    if not opted_in:
        # User needs to opt in first
        result = create_opt_in_transaction(receiver_address, asa_id)
    else:
        # User is already opted in, transfer directly
        result = transfer_asa(receiver_address, asa_id, amount)
        result['needs_optin'] = False
    
    print(json.dumps(result))
    sys.exit(0 if result['success'] else 1)
