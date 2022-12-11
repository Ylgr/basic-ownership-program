use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod basic_ownership {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fingerprint: [u8;16], owner: Pubkey) -> Result<()> {
        let ownership = &mut ctx.accounts.ownership;
        ownership.fingerprint = fingerprint;
        ownership.owner = owner;
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, owner: Pubkey) -> Result<()> {
        let ownership = &mut ctx.accounts.ownership;
        ownership.owner = owner;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(fingerprint: [u8;16], owner: Pubkey)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer=signer,
        space= 8 + 16 + 32
    )]
    pub ownership: Account<'info,Ownership>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info,System>,
}

#[derive(Accounts)]
#[instruction(new_owner: Pubkey)]
pub struct Transfer<'info> {
    #[account(
        mut,
        constraint = ownership.owner == *signer.to_account_info().key
    )]
    pub ownership: Account<'info,Ownership>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info,System>,
}

#[account]
pub struct Ownership {
    pub fingerprint: [u8; 16],
    pub owner: Pubkey,
}