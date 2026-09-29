import { Suspense } from 'react'
import { PeopleList } from '@/components/app/people-list'

export default function PeoplePage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      <PeopleList />
    </Suspense>
  )
}
