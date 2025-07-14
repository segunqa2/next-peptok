import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar, Users } from "lucide-react";
import { Expert } from "@/types";
import { Link } from "react-router-dom";

interface ExpertCardProps {
  expert: Expert;
}

const ExpertCard = ({ expert }: ExpertCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={expert.avatar} alt={expert.name} />
            <AvatarFallback>
              {expert.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight">
              {expert.name}
            </h3>
            <p className="text-sm text-muted-foreground">{expert.title}</p>
            <p className="text-sm text-primary font-medium">{expert.company}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {expert.bio}
        </p>

        <div className="flex flex-wrap gap-1">
          {expert.expertise.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {expert.expertise.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{expert.expertise.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{expert.rating}</span>
            <span>({expert.totalSessions} sessions)</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{expert.experience}y exp</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Next available: {expert.availableSlots[0]}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 space-x-2">
        <Button asChild className="flex-1">
          <Link to={`/experts/${expert.id}`}>View Profile</Link>
        </Button>
        <Button variant="outline" className="flex-1">
          Schedule Session
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExpertCard;
