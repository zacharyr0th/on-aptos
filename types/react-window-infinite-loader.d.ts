declare module "react-window-infinite-loader" {
  import { ComponentType } from "react";

  interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
    children: (props: any) => JSX.Element;
    threshold?: number;
    minimumBatchSize?: number;
  }

  const InfiniteLoader: ComponentType<InfiniteLoaderProps>;
  export default InfiniteLoader;
}
