'use client'

import { useState } from 'react'
import { Plus, Upload, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'
import type { Contact } from '@/lib/types'
import { toast } from 'sonner'

type Mode = 'pick' | 'single' | 'import'

export function AddPeopleDialog() {
  const { addContact, importContacts } = useStore()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('pick')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [paste, setPaste] = useState('')

  function reset() {
    setMode('pick')
    setName('')
    setEmail('')
    setAddress('')
    setCity('')
    setPaste('')
  }

  function submitSingle() {
    if (!name.trim() || !email.trim() || !address.trim()) {
      toast.error('Name, email, and address are required.')
      return
    }
    addContact({
      name: name.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim() || 'La Verne',
      closedDate: new Date().toISOString().slice(0, 10),
      status: 'needs_review',
      engagement: 'never_opened',
      groups: ['My Sphere'],
    })
    toast.success(`${name.trim()} added. We'll match their parcel.`)
    setOpen(false)
    reset()
  }

  function submitImport() {
    const rows = paste
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const parsed: Omit<Contact, 'id'>[] = []
    for (const line of rows) {
      const parts = line.split(/,|\t/).map((p) => p.trim())
      if (parts.length < 3) continue
      const [n, e, addr, c] = parts
      if (!n || !e || !addr) continue
      parsed.push({
        name: n,
        email: e,
        address: addr,
        city: c || 'La Verne',
        closedDate: new Date().toISOString().slice(0, 10),
        status: 'needs_review',
        engagement: 'never_opened',
        groups: ['My Sphere'],
      })
    }
    if (parsed.length === 0) {
      toast.error('No valid rows found. Use: Name, Email, Address, City')
      return
    }
    importContacts(parsed)
    toast.success(`Imported ${parsed.length} homeowners.`)
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-blue px-4 text-[14px] font-[560] text-white [&:hover]:bg-blue/90">
            <Plus className="size-4" />
            Add people
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        {mode === 'pick' && (
          <>
            <DialogHeader>
              <DialogTitle>Add homeowners</DialogTitle>
              <DialogDescription>
                We match each address to its county parcel automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <button
                type="button"
                onClick={() => setMode('single')}
                className="flex items-start gap-3 rounded-xl border border-line p-4 text-left hover:border-blue/50"
              >
                <UserPlus className="mt-0.5 size-5 text-blue" />
                <span>
                  <span className="block text-[14px] font-[600] text-ink">
                    Add one person
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    Type in a single homeowner.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('import')}
                className="flex items-start gap-3 rounded-xl border border-line p-4 text-left hover:border-blue/50"
              >
                <Upload className="mt-0.5 size-5 text-blue" />
                <span>
                  <span className="block text-[14px] font-[600] text-ink">
                    Paste a list
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    One per line: Name, Email, Address, City.
                  </span>
                </span>
              </button>
            </div>
          </>
        )}

        {mode === 'single' && (
          <>
            <DialogHeader>
              <DialogTitle>Add one person</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Property address">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="1142 Oakdale Ave"
                />
              </Field>
              <Field label="City">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="La Verne"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMode('pick')}
                className="border-line"
              >
                Back
              </Button>
              <Button
                onClick={submitSingle}
                className="bg-blue text-white [&:hover]:bg-blue/90"
              >
                Add homeowner
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === 'import' && (
          <>
            <DialogHeader>
              <DialogTitle>Paste a list</DialogTitle>
              <DialogDescription>
                One homeowner per line: Name, Email, Address, City
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="paste" className="sr-only">
                Homeowner list
              </Label>
              <Textarea
                id="paste"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={7}
                placeholder={
                  'Marilyn Okafor, marilyn@gmail.com, 1142 Oakdale Ave, La Verne\nGlenn Sato, glenn@icloud.com, 2201 Bonita Ave, San Dimas'
                }
                className="font-mono text-[13px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMode('pick')}
                className="border-line"
              >
                Back
              </Button>
              <Button
                onClick={submitImport}
                className="bg-blue text-white [&:hover]:bg-blue/90"
              >
                Import list
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  )
}
