import { Button } from "../components/ui/button";
import { MessageSquarePlus } from 'lucide-react';

export function NewChat(){
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-neutral-100 
    dark:hover:bg-neutral-800"
            data-testid="new-chat-button"
        >
            <MessageSquarePlus size={18}
                className="text-neutral-600 
              dark:text-neutral-400" />
        </Button>
    )
}