import type { PGliteInterface, Transaction } from '@electric-sql/pglite';

/** Every content part of a message `m`, as `part`. */
export const IMAGE_PARTS = `
  jsonb_array_elements(
    case when jsonb_typeof(m.data->'content') = 'array' then m.data->'content' else '[]' end
  ) as part`;

/** Matches parts that are images in the image cache, rather than files the app ships. */
export const STORED_IMAGE = `part->>'type' = 'image'
  and coalesce(part->'image'->>'sourceType', 'store') = 'store'`;

/** The image cache ids that saved messages use. */
export async function storedImageIds(db: PGliteInterface | Transaction) {
  const { rows } = await db.query<{ id: string }>(
    `select distinct part->'image'->>'storageId' as id from messages m, ${IMAGE_PARTS}
     where ${STORED_IMAGE}`,
  );
  return rows.map((row) => row.id);
}
