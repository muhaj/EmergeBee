"""
Deployment script for Algorand smart contracts on TestNet
Handles contract deployment and returns app ID
"""

import sys
import os
import base64
import json
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    StateSchema,
    OnComplete,
    wait_for_confirmation
)


# Algorand TestNet configuration (AlgoNode public API)
TESTNET_ALGOD_ADDRESS = "https://testnet-api.algonode.cloud"
TESTNET_ALGOD_TOKEN = ""  # Public node doesn't require token


def get_algod_client():
    """Create and return Algod client for TestNet"""
    return algod.AlgodClient(
        algod_token=TESTNET_ALGOD_TOKEN,
        algod_address=TESTNET_ALGOD_ADDRESS
    )


def compile_program(client, source_code):
    """
    Compile TEAL source code to bytecode
    
    Args:
        client: Algod client
        source_code: TEAL source code string
    
    Returns:
        bytes: Compiled program bytecode
    """
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])


def deploy_rental_escrow(
    deployer_mnemonic,
    organizer_addr,
    vendor_addr,
    deposit_amount,
    rental_fee,
    lease_start,
    lease_end
):
    """
    Deploy rental escrow smart contract to Algorand TestNet
    
    Args:
        deployer_mnemonic: 25-word mnemonic of deployer account
        organizer_addr: Event organizer wallet address
        vendor_addr: Prop vendor wallet address
        deposit_amount: Security deposit in microALGOs
        rental_fee: Total rental fee in microALGOs
        lease_start: Lease start timestamp (Unix seconds)
        lease_end: Lease end timestamp (Unix seconds)
    
    Returns:
        dict: {
            'success': bool,
            'app_id': int,
            'tx_id': str,
            'address': str (contract account address),
            'error': str (if failed)
        }
    """
    try:
        # Initialize client
        client = get_algod_client()
        
        # Get deployer account from mnemonic
        deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
        deployer_address = account.address_from_private_key(deployer_private_key)
        
        print(f"Deploying contract from: {deployer_address}")
        
        # Read compiled TEAL programs
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        with open(os.path.join(script_dir, "rental_escrow_approval.teal"), "r") as f:
            approval_program_source = f.read()
        
        with open(os.path.join(script_dir, "rental_escrow_clear.teal"), "r") as f:
            clear_program_source = f.read()
        
        # Compile programs to bytecode
        approval_program_compiled = compile_program(client, approval_program_source)
        clear_program_compiled = compile_program(client, clear_program_source)
        
        # Define state schema
        # Global state: 11 values (2 addresses + 9 uints)
        # Local state: none
        global_schema = StateSchema(num_uints=9, num_byte_slices=2)
        local_schema = StateSchema(num_uints=0, num_byte_slices=0)
        
        # Get suggested parameters
        params = client.suggested_params()
        
        # Prepare application args
        app_args = [
            organizer_addr.encode(),  # organizer wallet address
            vendor_addr.encode(),     # vendor wallet address  
            deposit_amount.to_bytes(8, 'big'),  # deposit amount
            rental_fee.to_bytes(8, 'big'),      # rental fee
            lease_start.to_bytes(8, 'big'),     # lease start timestamp
            lease_end.to_bytes(8, 'big')        # lease end timestamp
        ]
        
        # Create application transaction
        txn = ApplicationCreateTxn(
            sender=deployer_address,
            sp=params,
            on_complete=OnComplete.NoOpOC,
            approval_program=approval_program_compiled,
            clear_program=clear_program_compiled,
            global_schema=global_schema,
            local_schema=local_schema,
            app_args=app_args
        )
        
        # Sign transaction
        signed_txn = txn.sign(deployer_private_key)
        
        # Send transaction
        tx_id = client.send_transaction(signed_txn)
        print(f"Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("Waiting for confirmation...")
        confirmed_txn = wait_for_confirmation(client, tx_id, 4)
        
        # Get application ID
        app_id = confirmed_txn['application-index']
        
        # Calculate contract account address
        from algosdk.logic import get_application_address
        contract_address = get_application_address(app_id)
        
        print(f"✅ Contract deployed successfully!")
        print(f"   App ID: {app_id}")
        print(f"   Contract Address: {contract_address}")
        print(f"   Transaction: {tx_id}")
        print(f"   Explorer: https://testnet.algoexplorer.io/application/{app_id}")
        
        return {
            'success': True,
            'app_id': app_id,
            'tx_id': tx_id,
            'address': contract_address
        }
        
    except Exception as e:
        error_message = str(e)
        print(f"❌ Deployment failed: {error_message}")
        return {
            'success': False,
            'error': error_message
        }


if __name__ == "__main__":
    # Example usage (requires environment variables or command line args)
    import os
    
    deployer_mnemonic = os.getenv('ALGORAND_DEPLOYER_MNEMONIC')
    
    if not deployer_mnemonic:
        print("Error: ALGORAND_DEPLOYER_MNEMONIC environment variable not set")
        print("\nTo deploy:")
        print("1. Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        print("2. Set environment variable:")
        print("   export ALGORAND_DEPLOYER_MNEMONIC='your 25-word mnemonic'")
        print("3. Run this script with parameters")
        sys.exit(1)
    
    # Example deployment (replace with actual values)
    result = deploy_rental_escrow(
        deployer_mnemonic=deployer_mnemonic,
        organizer_addr="TESTADDRESS1234567890ABCDEFGHIJK",  # Replace
        vendor_addr="TESTADDRESS0987654321ZYXWVUTSRQP",     # Replace
        deposit_amount=50_000_000,  # 50 ALGO
        rental_fee=100_000_000,     # 100 ALGO
        lease_start=int(1729267200),  # Unix timestamp
        lease_end=int(1731859200)     # Unix timestamp
    )
    
    print(json.dumps(result, indent=2))
