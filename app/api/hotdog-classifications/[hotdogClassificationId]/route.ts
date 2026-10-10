import DataDeletionHandler from '@/server/api/dataDeletion/DataDeletion.handler';

const dataDeletionHandler = new DataDeletionHandler();

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ hotdogClassificationId: string }> },
) => {
  const { hotdogClassificationId } = await params;
  return dataDeletionHandler.deleteHotdogClassification(request, { hotdogClassificationId });
};
