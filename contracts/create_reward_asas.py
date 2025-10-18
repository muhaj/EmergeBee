"""
Create Spectacle Reward ASAs (Algorand Standard Assets) on TestNet
Creates Bronze, Silver, and Gold reward tokens
"""

import sys
import os
import json
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    AssetConfigTxn,
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


def create_reward_asa(
    creator_mnemonic,
    asset_name,
    unit_name,
    total_supply,
    decimals=0,
    url="",
    metadata_hash=None
):
    """
    Create an Algorand Standard Asset for game rewards
    
    Args:
        creator_mnemonic: 25-word mnemonic of creator account
        asset_name: Full name of the asset (e.g., "Spectacle Bronze Medal")
        unit_name: Short ticker (e.g., "SPBRNZ")
        total_supply: Total number of tokens to create
        decimals: Number of decimal places (0 for NFT-like tokens)
        url: Optional URL with asset information
        metadata_hash: Optional 32-byte metadata hash
    
    Returns:
        dict: {
            'success': bool,
            'asa_id': int,
            'tx_id': str,
            'error': str (if failed)
        }
    """
    try:
        # Initialize client
        client = get_algod_client()
        
        # Get creator account from mnemonic
        creator_private_key = mnemonic.to_private_key(creator_mnemonic)
        creator_address = account.address_from_private_key(creator_private_key)
        
        print(f"Creating ASA from: {creator_address}")
        print(f"Asset: {asset_name} ({unit_name})")
        
        # Get suggested parameters
        params = client.suggested_params()
        
        # Create asset creation transaction
        txn = AssetConfigTxn(
            sender=creator_address,
            sp=params,
            total=total_supply,
            default_frozen=False,
            unit_name=unit_name,
            asset_name=asset_name,
            manager=creator_address,  # Can modify asset config
            reserve=creator_address,  # Address holding reserve (non-minted) units
            freeze=creator_address,   # Can freeze holdings
            clawback=creator_address, # Can revoke holdings (for rewards, useful if fraud detected)
            url=url,
            metadata_hash=metadata_hash,
            decimals=decimals
        )
        
        # Sign transaction
        signed_txn = txn.sign(creator_private_key)
        
        # Send transaction
        tx_id = client.send_transaction(signed_txn)
        print(f"Transaction ID: {tx_id}")
        
        # Wait for confirmation
        print("Waiting for confirmation...")
        confirmed_txn = wait_for_confirmation(client, tx_id, 4)
        
        # Get asset ID
        asa_id = confirmed_txn['asset-index']
        
        print(f"✅ ASA created successfully!")
        print(f"   Asset ID: {asa_id}")
        print(f"   Name: {asset_name}")
        print(f"   Unit: {unit_name}")
        print(f"   Supply: {total_supply}")
        print(f"   Transaction: {tx_id}")
        print(f"   Explorer: https://testnet.algoexplorer.io/asset/{asa_id}")
        
        return {
            'success': True,
            'asa_id': asa_id,
            'tx_id': tx_id,
            'asset_name': asset_name,
            'unit_name': unit_name
        }
        
    except Exception as e:
        error_message = str(e)
        print(f"❌ ASA creation failed: {error_message}")
        return {
            'success': False,
            'error': error_message
        }


def create_all_reward_asas(creator_mnemonic):
    """
    Create all three reward tier ASAs (Bronze, Silver, Gold)
    
    Args:
        creator_mnemonic: 25-word mnemonic of creator account
    
    Returns:
        dict: {
            'success': bool,
            'asas': {
                'bronze': {'asa_id': int, 'tx_id': str},
                'silver': {'asa_id': int, 'tx_id': str},
                'gold': {'asa_id': int, 'tx_id': str}
            },
            'error': str (if failed)
        }
    """
    results = {}
    
    # Define reward tiers
    reward_tiers = [
        {
            'tier': 'bronze',
            'asset_name': 'Spectacle Bronze Medal',
            'unit_name': 'SPBRNZ',
            'total_supply': 1_000_000,  # 1 million bronze medals
            'url': 'https://spectacle.repl.co/rewards/bronze'
        },
        {
            'tier': 'silver',
            'asset_name': 'Spectacle Silver Medal',
            'unit_name': 'SPSLVR',
            'total_supply': 500_000,  # 500k silver medals (rarer)
            'url': 'https://spectacle.repl.co/rewards/silver'
        },
        {
            'tier': 'gold',
            'asset_name': 'Spectacle Gold Medal',
            'unit_name': 'SPGOLD',
            'total_supply': 100_000,  # 100k gold medals (rarest)
            'url': 'https://spectacle.repl.co/rewards/gold'
        }
    ]
    
    print("=" * 60)
    print("Creating Spectacle Reward ASAs on Algorand TestNet")
    print("=" * 60)
    
    all_successful = True
    asas = {}
    
    for tier_config in reward_tiers:
        print(f"\n📍 Creating {tier_config['tier'].upper()} tier...")
        
        result = create_reward_asa(
            creator_mnemonic=creator_mnemonic,
            asset_name=tier_config['asset_name'],
            unit_name=tier_config['unit_name'],
            total_supply=tier_config['total_supply'],
            decimals=0,  # No fractional tokens
            url=tier_config['url']
        )
        
        if result['success']:
            asas[tier_config['tier']] = {
                'asa_id': result['asa_id'],
                'tx_id': result['tx_id'],
                'asset_name': result['asset_name'],
                'unit_name': result['unit_name']
            }
        else:
            all_successful = False
            print(f"❌ Failed to create {tier_config['tier']} ASA")
            break
    
    if all_successful:
        print("\n" + "=" * 60)
        print("✅ All reward ASAs created successfully!")
        print("=" * 60)
        print("\nASA IDs:")
        for tier, data in asas.items():
            print(f"  {tier.upper()}: {data['asa_id']} ({data['unit_name']})")
        
        return {
            'success': True,
            'asas': asas
        }
    else:
        return {
            'success': False,
            'error': 'Failed to create one or more ASAs',
            'asas': asas
        }


if __name__ == "__main__":
    # Get creator mnemonic from environment
    creator_mnemonic = os.getenv('ALGORAND_DEPLOYER_MNEMONIC')
    
    if not creator_mnemonic:
        print("Error: ALGORAND_DEPLOYER_MNEMONIC environment variable not set")
        print("\nTo create reward ASAs:")
        print("1. Get TestNet ALGO from: https://bank.testnet.algorand.network/")
        print("2. Set environment variable:")
        print("   export ALGORAND_DEPLOYER_MNEMONIC='your 25-word mnemonic'")
        print("3. Run this script")
        sys.exit(1)
    
    # Create all reward ASAs
    result = create_all_reward_asas(creator_mnemonic)
    
    # Output JSON result
    print("\n" + "=" * 60)
    print("JSON Output:")
    print("=" * 60)
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result['success'] else 1)
