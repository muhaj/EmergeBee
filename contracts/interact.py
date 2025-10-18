"""
Interaction utilities for deployed Algorand rental escrow contracts
Provides functions to call contract methods from backend
"""

import base64
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCallTxn,
    PaymentTxn,
    OnComplete,
    assign_group_id,
    wait_for_confirmation
)
from algosdk.logic import get_application_address


# Algorand TestNet configuration
TESTNET_ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
TESTNET_ALGOD_TOKEN = ""


def get_algod_client():
    """Create and return Algod client for TestNet"""
    return algod.AlgodClient(
        algod_token=TESTNET_ALGOD_TOKEN,
        algod_address=TESTNET_ALGOD_ADDRESS
    )


def pay_deposit(user_mnemonic, app_id, deposit_amount, rental_fee):
    """
    Organizer pays deposit + rental fee to escrow contract
    
    Args:
        user_mnemonic: Organizer's 25-word mnemonic
        app_id: Application ID of deployed contract
        deposit_amount: Security deposit in microALGOs
        rental_fee: Rental fee in microALGOs
    
    Returns:
        dict: {'success': bool, 'tx_id': str, 'error': str}
    """
    try:
        client = get_algod_client()
        
        # Get user account
        user_private_key = mnemonic.to_private_key(user_mnemonic)
        user_address = account.address_from_private_key(user_private_key)
        
        # Get contract address
        contract_address = get_application_address(app_id)
        
        # Get suggested parameters
        params = client.suggested_params()
        
        # Transaction 1: Application call with "deposit" arg
        app_call_txn = ApplicationCallTxn(
            sender=user_address,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"deposit"]
        )
        
        # Transaction 2: Payment to contract
        payment_txn = PaymentTxn(
            sender=user_address,
            sp=params,
            receiver=contract_address,
            amt=deposit_amount + rental_fee
        )
        
        # Group transactions
        gid = assign_group_id([app_call_txn, payment_txn])
        
        # Sign transactions
        signed_app_call = app_call_txn.sign(user_private_key)
        signed_payment = payment_txn.sign(user_private_key)
        
        # Send transaction group
        tx_id = client.send_transactions([signed_app_call, signed_payment])
        
        # Wait for confirmation
        wait_for_confirmation(client, tx_id, 4)
        
        return {'success': True, 'tx_id': tx_id}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def confirm_delivery(vendor_mnemonic, app_id):
    """
    Vendor confirms prop delivery
    
    Args:
        vendor_mnemonic: Vendor's 25-word mnemonic
        app_id: Application ID of deployed contract
    
    Returns:
        dict: {'success': bool, 'tx_id': str, 'error': str}
    """
    try:
        client = get_algod_client()
        
        vendor_private_key = mnemonic.to_private_key(vendor_mnemonic)
        vendor_address = account.address_from_private_key(vendor_private_key)
        
        params = client.suggested_params()
        
        txn = ApplicationCallTxn(
            sender=vendor_address,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"delivery"]
        )
        
        signed_txn = txn.sign(vendor_private_key)
        tx_id = client.send_transaction(signed_txn)
        
        wait_for_confirmation(client, tx_id, 4)
        
        return {'success': True, 'tx_id': tx_id}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def confirm_return(organizer_mnemonic, app_id):
    """
    Organizer confirms prop return
    
    Args:
        organizer_mnemonic: Organizer's 25-word mnemonic
        app_id: Application ID of deployed contract
    
    Returns:
        dict: {'success': bool, 'tx_id': str, 'error': str}
    """
    try:
        client = get_algod_client()
        
        organizer_private_key = mnemonic.to_private_key(organizer_mnemonic)
        organizer_address = account.address_from_private_key(organizer_private_key)
        
        params = client.suggested_params()
        
        txn = ApplicationCallTxn(
            sender=organizer_address,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"return"]
        )
        
        signed_txn = txn.sign(organizer_private_key)
        tx_id = client.send_transaction(signed_txn)
        
        wait_for_confirmation(client, tx_id, 4)
        
        return {'success': True, 'tx_id': tx_id}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def refund_deposit(app_id, signer_mnemonic, organizer_addr):
    """
    Refund deposit to organizer (requires contract to sign inner txn)
    Note: This simplified version assumes contract can create inner transactions
    
    Args:
        app_id: Application ID
        signer_mnemonic: Account authorized to trigger refund
        organizer_addr: Address to receive refund
    
    Returns:
        dict: {'success': bool, 'tx_id': str, 'error': str}
    """
    try:
        client = get_algod_client()
        
        signer_private_key = mnemonic.to_private_key(signer_mnemonic)
        signer_address = account.address_from_private_key(signer_private_key)
        
        params = client.suggested_params()
        
        # Note: In production, this would need proper inner transaction support
        # For now, this is a placeholder for the contract interaction pattern
        txn = ApplicationCallTxn(
            sender=signer_address,
            sp=params,
            index=app_id,
            on_complete=OnComplete.NoOpOC,
            app_args=[b"refund"]
        )
        
        signed_txn = txn.sign(signer_private_key)
        tx_id = client.send_transaction(signed_txn)
        
        wait_for_confirmation(client, tx_id, 4)
        
        return {'success': True, 'tx_id': tx_id}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_contract_state(app_id):
    """
    Read global state of escrow contract
    
    Args:
        app_id: Application ID
    
    Returns:
        dict: Contract state with decoded values
    """
    try:
        client = get_algod_client()
        
        app_info = client.application_info(app_id)
        global_state = app_info['params']['global-state']
        
        # Decode state
        decoded_state = {}
        for item in global_state:
            key = base64.b64decode(item['key']).decode('utf-8')
            
            if item['value']['type'] == 1:  # bytes
                value = base64.b64decode(item['value']['bytes']).decode('utf-8')
            else:  # uint
                value = item['value']['uint']
            
            decoded_state[key] = value
        
        return {'success': True, 'state': decoded_state}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}


if __name__ == "__main__":
    # Example: Read contract state
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python interact.py <app_id>")
        sys.exit(1)
    
    app_id = int(sys.argv[1])
    result = get_contract_state(app_id)
    
    if result['success']:
        print("Contract State:")
        for key, value in result['state'].items():
            print(f"  {key}: {value}")
    else:
        print(f"Error: {result['error']}")
