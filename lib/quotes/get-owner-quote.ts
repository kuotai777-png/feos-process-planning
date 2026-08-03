import {desc,eq} from "drizzle-orm";
import {getDb} from "@/db";
import {quotes,quoteVersions} from "@/db/schema";
import {parseClientFacingQuote,type ClientFacingQuote} from "./client-facing";

export type OwnerQuoteResult=
  |{kind:"ready";quoteId:string;versionId:string;versionNumber:string;status:string;data:ClientFacingQuote}
  |{kind:"not_found"}
  |{kind:"unsafe_or_invalid"};

export async function getOwnerQuote(quoteId:string):Promise<OwnerQuoteResult>{
  const [row]=await getDb().select({
    quoteId:quotes.id,
    versionId:quoteVersions.id,
    versionNumber:quoteVersions.versionNumber,
    status:quotes.status,
    clientFacingJson:quoteVersions.clientFacingJson,
  }).from(quotes)
    .innerJoin(quoteVersions,eq(quoteVersions.quoteId,quotes.id))
    .where(eq(quotes.id,quoteId))
    .orderBy(desc(quoteVersions.createdAt))
    .limit(1);

  if(!row)return {kind:"not_found"};
  const parsed=parseClientFacingQuote(row.clientFacingJson);
  if(!parsed.ok)return {kind:"unsafe_or_invalid"};
  return {
    kind:"ready",
    quoteId:row.quoteId,
    versionId:row.versionId,
    versionNumber:row.versionNumber,
    status:row.status,
    data:parsed.data,
  };
}