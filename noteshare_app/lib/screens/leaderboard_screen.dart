import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Top Contributors'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('users')
            .orderBy('points', descending: true)
            .limit(50) // Show top 50 users
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No users found.'));
          }

          final users = snapshot.data!.docs;
          final theme = Theme.of(context);

          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index].data() as Map<String, dynamic>;
              final rank = index + 1;
              
              // This is the corrected line.
              Widget leadingWidget; 
              
              if (rank == 1) {
                leadingWidget = Icon(Icons.emoji_events, color: Colors.amber[700]);
              } else if (rank == 2) {
                leadingWidget = Icon(Icons.emoji_events, color: Colors.grey[400]);
              } else if (rank == 3) {
                leadingWidget = Icon(Icons.emoji_events, color: Colors.brown[400]);
              } else {
                leadingWidget = CircleAvatar(
                  radius: 12,
                  backgroundColor: theme.colorScheme.secondaryContainer,
                  child: Text(
                    '$rank', 
                    style: TextStyle(fontSize: 12, color: theme.colorScheme.onSecondaryContainer),
                  ),
                );
              }
              
              return ListTile(
                leading: leadingWidget,
                title: Text(user['name'] ?? 'Anonymous', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(user['programme'] ?? 'No Programme'),
                trailing: Chip(
                  avatar: Icon(Icons.star, color: theme.colorScheme.onSecondaryContainer, size: 16),
                  label: Text('${user['points'] ?? 0} pts'),
                  backgroundColor: theme.colorScheme.secondaryContainer,
                  labelStyle: TextStyle(color: theme.colorScheme.onSecondaryContainer, fontWeight: FontWeight.bold),
                ),
              );
            },
          );
        },
      ),
    );
  }
}