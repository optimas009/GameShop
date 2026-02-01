import MediaUtil from "./MediaUtil";

function NormalizePostMedia(post) {
  const media = Array.isArray(post?.media) ? [...post.media] : [];
  const youtubeUrls = Array.isArray(post?.youtubeUrls) ? [...post.youtubeUrls] : [];

  const img = String(post?.imageUrl || "").trim();
  const vid = String(post?.videoUrl || "").trim();

  if (img) media.push(img);

  if (vid) {
    if (MediaUtil.getYoutubeId(vid)) youtubeUrls.push(vid);
    else media.push(vid);
  }

  const uniq = (arr) =>
    [...new Set(arr.map((x) => String(x || "").trim()).filter(Boolean))];

  return {
    media: uniq(media),
    youtubeUrls: uniq(youtubeUrls),
  };
}

export default NormalizePostMedia;
