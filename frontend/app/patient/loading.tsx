import BrandedLoading from "@/components/shared/BrandedLoading";

export default function Loading() {
    return (
        <div className="fixed inset-0 lg:ml-72 bg-white z-[9999] flex items-center justify-center">
            <BrandedLoading
                message="Syncing Health Metrics..."
                fullScreen={false}
            />
        </div>
    );
}
