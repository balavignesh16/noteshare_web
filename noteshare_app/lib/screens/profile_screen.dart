import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final theme = Theme.of(context);

    if (user == null) {
      return const Scaffold(body: Center(child: Text("Not logged in.")));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance.collection('users').doc(user.uid).snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text('Could not load profile.'));
          }

          final profileData = snapshot.data!.data() as Map<String, dynamic>;

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Text(
                        profileData['name']?[0].toUpperCase() ?? '?',
                        style: TextStyle(fontSize: 40, color: theme.colorScheme.onPrimaryContainer),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      profileData['name'] ?? 'No Name',
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      user.email ?? '',
                      style: theme.textTheme.titleMedium?.copyWith(color: Colors.grey),
                    ),
                     const SizedBox(height: 8),
                    Chip(
                      label: Text('${profileData['points'] ?? 0} Points'),
                      avatar: const Icon(Icons.star, size: 18),
                      backgroundColor: Colors.amber[100],
                      labelStyle: TextStyle(color: Colors.amber[900], fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              ProfileInfoTile(icon: Icons.school_outlined, title: 'Programme', value: profileData['programme'] ?? 'N/A'),
              ProfileInfoTile(icon: Icons.badge_outlined, title: 'Registration No.', value: profileData['registrationNumber'] ?? 'N/A'),
              ProfileInfoTile(icon: Icons.calendar_today_outlined, title: 'Joining Year', value: profileData['joiningYear']?.toString() ?? 'N/A'),
              const SizedBox(height: 16),
              Text('Subscribed Courses', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8.0,
                runSpacing: 4.0,
                children: (profileData['subscribedCourses'] as List<dynamic>?)
                    ?.map((course) => Chip(label: Text(course)))
                    .toList() ?? [const Text('No courses subscribed.')],
              ),
            ],
          );
        },
      ),
    );
  }
}

class ProfileInfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const ProfileInfoTile({
    Key? key,
    required this.icon,
    required this.title,
    required this.value,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.secondary),
      title: Text(title),
      subtitle: Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }
}