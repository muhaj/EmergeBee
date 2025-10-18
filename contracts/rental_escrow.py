"""
Rental Escrow Smart Contract for Spectacle Platform
Handles security deposit escrow for prop rentals on Algorand
"""

from pyteal import *


def approval_program():
    """
    Stateful smart contract for rental deposit escrow.
    
    Global State:
    - organizer (bytes): Wallet address of event organizer (renter)
    - vendor (bytes): Wallet address of prop vendor (owner)
    - deposit_amount (uint): Security deposit amount in microALGOs
    - rental_fee (uint): Total rental fee in microALGOs
    - lease_start (uint): Lease start timestamp
    - lease_end (uint): Lease end timestamp
    - deposit_paid (uint): Boolean flag if deposit has been paid
    - prop_delivered (uint): Boolean flag if prop has been delivered
    - prop_returned (uint): Boolean flag if prop has been returned
    - damage_reported (uint): Boolean flag if damage was reported
    - dispute_active (uint): Boolean flag if dispute is active
    """
    
    # Global state keys
    organizer_key = Bytes("organizer")
    vendor_key = Bytes("vendor")
    deposit_amount_key = Bytes("deposit_amount")
    rental_fee_key = Bytes("rental_fee")
    lease_start_key = Bytes("lease_start")
    lease_end_key = Bytes("lease_end")
    deposit_paid_key = Bytes("deposit_paid")
    prop_delivered_key = Bytes("prop_delivered")
    prop_returned_key = Bytes("prop_returned")
    damage_reported_key = Bytes("damage_reported")
    dispute_active_key = Bytes("dispute_active")
    
    # Initialize contract on creation
    # Args: [organizer_addr, vendor_addr, deposit_amount, rental_fee, lease_start, lease_end]
    on_creation = Seq([
        Assert(Txn.application_args.length() == Int(6)),
        App.globalPut(organizer_key, Txn.application_args[0]),
        App.globalPut(vendor_key, Txn.application_args[1]),
        App.globalPut(deposit_amount_key, Btoi(Txn.application_args[2])),
        App.globalPut(rental_fee_key, Btoi(Txn.application_args[3])),
        App.globalPut(lease_start_key, Btoi(Txn.application_args[4])),
        App.globalPut(lease_end_key, Btoi(Txn.application_args[5])),
        App.globalPut(deposit_paid_key, Int(0)),
        App.globalPut(prop_delivered_key, Int(0)),
        App.globalPut(prop_returned_key, Int(0)),
        App.globalPut(damage_reported_key, Int(0)),
        App.globalPut(dispute_active_key, Int(0)),
        Approve()
    ])
    
    # Organizer pays deposit + rental fee
    # Grouped transaction: [App call, Payment to contract]
    on_deposit = Seq([
        Assert(Txn.sender() == App.globalGet(organizer_key)),
        Assert(App.globalGet(deposit_paid_key) == Int(0)),
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].sender() == App.globalGet(organizer_key)),
        Assert(Gtxn[1].receiver() == Global.current_application_address()),
        Assert(
            Gtxn[1].amount() >= 
            App.globalGet(deposit_amount_key) + App.globalGet(rental_fee_key)
        ),
        App.globalPut(deposit_paid_key, Int(1)),
        Approve()
    ])
    
    # Vendor confirms prop delivery
    on_delivery = Seq([
        Assert(Txn.sender() == App.globalGet(vendor_key)),
        Assert(App.globalGet(deposit_paid_key) == Int(1)),
        Assert(App.globalGet(prop_delivered_key) == Int(0)),
        App.globalPut(prop_delivered_key, Int(1)),
        Approve()
    ])
    
    # Organizer confirms prop return
    on_return = Seq([
        Assert(Txn.sender() == App.globalGet(organizer_key)),
        Assert(App.globalGet(prop_delivered_key) == Int(1)),
        Assert(App.globalGet(prop_returned_key) == Int(0)),
        App.globalPut(prop_returned_key, Int(1)),
        Approve()
    ])
    
    # Vendor reports damage
    on_damage = Seq([
        Assert(Txn.sender() == App.globalGet(vendor_key)),
        Assert(App.globalGet(prop_returned_key) == Int(1)),
        App.globalPut(damage_reported_key, Int(1)),
        App.globalPut(dispute_active_key, Int(1)),
        Approve()
    ])
    
    # Release rental fee to vendor (after delivery)
    # Grouped transaction: [App call, Inner payment to vendor]
    on_release_rental_fee = Seq([
        Assert(App.globalGet(prop_delivered_key) == Int(1)),
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].sender() == Global.current_application_address()),
        Assert(Gtxn[1].receiver() == App.globalGet(vendor_key)),
        Assert(Gtxn[1].amount() == App.globalGet(rental_fee_key)),
        Approve()
    ])
    
    # Refund deposit to organizer (no damage, prop returned)
    # Grouped transaction: [App call, Inner payment to organizer]
    on_refund_deposit = Seq([
        Assert(App.globalGet(prop_returned_key) == Int(1)),
        Assert(App.globalGet(damage_reported_key) == Int(0)),
        Assert(App.globalGet(dispute_active_key) == Int(0)),
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].sender() == Global.current_application_address()),
        Assert(Gtxn[1].receiver() == App.globalGet(organizer_key)),
        Assert(Gtxn[1].amount() == App.globalGet(deposit_amount_key)),
        Approve()
    ])
    
    # Claim deposit to vendor (damage reported)
    # Grouped transaction: [App call, Inner payment to vendor]
    on_claim_deposit = Seq([
        Assert(App.globalGet(damage_reported_key) == Int(1)),
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].sender() == Global.current_application_address()),
        Assert(Gtxn[1].receiver() == App.globalGet(vendor_key)),
        Assert(Gtxn[1].amount() == App.globalGet(deposit_amount_key)),
        Approve()
    ])
    
    # Emergency timeout release (after lease end + grace period)
    # If no action taken, vendor can claim everything after 30 days past lease end
    on_timeout_claim = Seq([
        Assert(Txn.sender() == App.globalGet(vendor_key)),
        Assert(Global.latest_timestamp() >= App.globalGet(lease_end_key) + Int(2592000)),  # 30 days
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].sender() == Global.current_application_address()),
        Assert(Gtxn[1].receiver() == App.globalGet(vendor_key)),
        Assert(Gtxn[1].close_remainder_to() == App.globalGet(vendor_key)),
        Approve()
    ])
    
    # Route based on application call argument
    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.application_args[0] == Bytes("deposit"), on_deposit],
        [Txn.application_args[0] == Bytes("delivery"), on_delivery],
        [Txn.application_args[0] == Bytes("return"), on_return],
        [Txn.application_args[0] == Bytes("damage"), on_damage],
        [Txn.application_args[0] == Bytes("release_fee"), on_release_rental_fee],
        [Txn.application_args[0] == Bytes("refund"), on_refund_deposit],
        [Txn.application_args[0] == Bytes("claim"), on_claim_deposit],
        [Txn.application_args[0] == Bytes("timeout"), on_timeout_claim]
    )
    
    return program


def clear_state_program():
    """
    Handles opt-out logic.
    Reject all clear state attempts to prevent accidental loss of funds.
    """
    return Reject()


if __name__ == "__main__":
    # Compile to TEAL
    with open("rental_escrow_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=10)
        f.write(compiled)
    
    with open("rental_escrow_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=10)
        f.write(compiled)
    
    print("✅ Compiled rental escrow smart contract to TEAL")
    print("   - rental_escrow_approval.teal")
    print("   - rental_escrow_clear.teal")
