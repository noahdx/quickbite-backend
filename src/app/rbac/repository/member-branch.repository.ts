import { Knex } from 'knex';
import { MemberBranch } from '../entity/member-branches.entity';
import { db } from '../../../lib/knex/knex';

export async function setMemberBranches(memberId: number, rows: MemberBranch[], conn: Knex = db) {
  // delete existing assignments, then insert the new set (transactionally if a conn is passed)
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

export async function findBranchIdsByMemberId(memberId: number, conn: Knex = db): Promise<number[]> {
  const rows = await conn('member_branches').select('branch_id').where('member_id', memberId);
  return rows.map((row) => row.branch_id);
}

export async function removeMember(memberId: number) {
  await db('member_branches').where('id', memberId).delete();
}
