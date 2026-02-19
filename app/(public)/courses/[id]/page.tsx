interface CoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl">Course: {id}</h1>
    </div>
  );
}

