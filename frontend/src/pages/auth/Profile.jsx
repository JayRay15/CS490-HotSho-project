import Card from "../components/Card";
import InputField from "../components/InputField";
import Button from "../components/Button";

export default function Profile() {
    return (
        <div className="max-w-5xl mx-auto p-6">
            <h2 className="text-2xl font-heading mb-4">My Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card title="Avatar">
                        <div className="flex items-center flex-col">
                            <div className="w-32 h-32 rounded-full bg-neutral-200 mb-4" />
                            <Button variant="secondary">Upload Photo</Button>
                        </div>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card title="Basic Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="First name" />
                            <InputField label="Last name" />
                            <InputField label="Email" />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button>Save</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
