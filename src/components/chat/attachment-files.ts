import config from '~/config';

export function validateAttachmentFiles(files: Iterable<File>) {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!config.attachments.types.includes(file.type)) {
      errors.push(`${file.name}: unsupported file type. Use PNG, JPEG, GIF or WebP.`);
    } else if (file.size > config.attachments.maxSize) {
      errors.push(
        `${file.name}: image is too large. Maximum size is ${config.attachments.maxSize / 1024 / 1024} MiB per image.`,
      );
    } else {
      accepted.push(file);
    }
  }

  return { files: accepted, errors };
}
