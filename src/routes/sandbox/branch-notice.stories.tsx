import { BranchNotice } from '~/components/chat/components';

export function Linked() {
  return <BranchNotice parentTitle="Planning the launch" href="/sandbox/branch-notice" />;
}

export function ParentDeleted() {
  return <BranchNotice parentTitle="Planning the launch" />;
}
