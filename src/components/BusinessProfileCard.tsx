import type { ReactNode } from "react";
import type { BusinessProfileResponse } from "@stock-analyzer/shared";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type BusinessProfileCardProps = {
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: BusinessProfileResponse | undefined;
};

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function BusinessProfileCard({
  isPending,
  isError,
  error,
  data,
}: BusinessProfileCardProps) {
  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon />
        <AlertTitle>Could not load business profile</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const { profile } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business profile</CardTitle>
        <CardDescription>
          AI-generated overview
          {data.generatedAt
            ? ` · ${new Date(data.generatedAt).toLocaleDateString()}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ProfileSection title="What they do">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {profile.businessDescription}
          </p>
        </ProfileSection>

        <ProfileSection title="Core business models">
          <BulletList items={profile.businessModels} />
        </ProfileSection>

        <ProfileSection title="Sector">
          <p className="text-sm text-muted-foreground">{profile.sector}</p>
        </ProfileSection>

        <ProfileSection title="Core threats">
          <BulletList items={profile.coreThreats} />
        </ProfileSection>
      </CardContent>
    </Card>
  );
}
