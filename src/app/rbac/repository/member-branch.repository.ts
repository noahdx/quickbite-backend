import { Knex } from 'knex';
import { db } from '../../../lib/knex/knex';
import { MemberBranch } from '../entity/member-branches.entity';

export async function setMemberBranches(memberId: number, rows: MemberBranch[], conn: Knex = db) {
  // delete existing assignments, then insert the new set
  await conn('member_branches').where('member_id', memberId).delete();

  if (rows.length > 0) {
    await conn('member_branches').insert(
      rows.map((row) => ({
        member_id: row.memberId,
        branch_id: row.branchId,
        created_at: row.createdAt,
      })),
    );
  }
}

export async function findBranchIdsByMemberId(memberId: number): Promise<number[]> {
  const rows = await db('member_branches').select('branch_id').where('member_id', memberId);
  return rows.map((row) => row.branch_id);
}
